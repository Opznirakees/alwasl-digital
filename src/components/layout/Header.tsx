'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronDown,
  CircleHelp,
  Globe,
  History,
  Home,
  Loader2,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  Settings,
  Sun,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { mobileMenuSheetCopy } from './mobile-menu-copy';

const languageOptions = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'ar', label: 'العربية', short: 'عربي' },
  { id: 'zh', label: '中文', short: '中文' },
] as const;

export function Header() {
  const pathname = usePathname();
  const {
    t,
    language,
    setLanguage,
    dir,
    user,
    isAuthenticated,
    isAccountLoading,
    logout,
    formatLocalAmount,
    theme,
    toggleTheme,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLanguage = languageOptions.find((option) => option.id === language) ?? languageOptions[0];

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/top-up/waho-top-up') return pathname.startsWith('/top-up');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const navLinkClass = (href: string) => cn(
    'flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    isRouteActive(href)
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/10'
  );

  const mobileTabs = [
    { href: '/', label: t('Home', 'الرئيسية', '首页'), icon: Home, active: pathname === '/' },
    {
      href: '/top-up/waho-top-up',
      label: t('Top up', 'اشحن', '充值'),
      icon: Zap,
      active: pathname.startsWith('/top-up'),
    },
    isAuthenticated
      ? {
          href: '/orders',
          label: t('Orders', 'الطلبات', '订单'),
          icon: ReceiptText,
          active: pathname.startsWith('/orders'),
        }
      : {
          href: '/help',
          label: t('Help', 'مساعدة', '帮助'),
          icon: CircleHelp,
          active: pathname.startsWith('/help') || pathname.startsWith('/faq') || pathname.startsWith('/contact'),
        },
    isAccountLoading
      ? {
          href: '/profile',
          label: t('Account', 'الحساب', '账号'),
          icon: User,
          active: ['/profile', '/wallet', '/settings'].some((route) => pathname.startsWith(route)),
        }
      : isAuthenticated
        ? {
          href: '/profile',
          label: t('Account', 'الحساب', '账号'),
          icon: User,
          active: ['/profile', '/wallet', '/settings'].some((route) => pathname.startsWith(route)),
          }
        : {
          href: '/auth',
          label: t('Login', 'دخول', '登录'),
          icon: User,
          active: pathname.startsWith('/auth'),
          },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid h-16 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 lg:flex lg:gap-6">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  aria-label={t('Open menu', 'افتح القائمة', '打开菜单')}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={dir === 'rtl' ? 'right' : 'left'}
                className="w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
              >
                <SheetHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                  <SheetTitle className="text-zinc-950 dark:text-white">
                    {t('Menu', 'القائمة', '菜单')}
                  </SheetTitle>
                  <SheetDescription className="text-zinc-500 dark:text-zinc-400">
                    {t(
                      mobileMenuSheetCopy.description.en,
                      mobileMenuSheetCopy.description.ar,
                      mobileMenuSheetCopy.description.zh
                    )}
                  </SheetDescription>
                </SheetHeader>

                <nav aria-label={t('Main menu', 'القائمة الرئيسية', '主菜单')} className="mt-7 grid gap-1">
                  <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={navLinkClass('/')} onClick={closeMobileMenu}>
                    {t('Home', 'الرئيسية', '首页')}
                  </Link>
                  <Link href="/top-up/waho-top-up" aria-current={pathname.startsWith('/top-up') ? 'page' : undefined} className={navLinkClass('/top-up/waho-top-up')} onClick={closeMobileMenu}>
                    {t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}
                  </Link>
                  <Link href="/promotions" aria-current={isRouteActive('/promotions') ? 'page' : undefined} className={navLinkClass('/promotions')} onClick={closeMobileMenu}>
                    {t('WAHO Offers', 'عروض WAHO', 'WAHO 优惠')}
                  </Link>
                  <Link href="/help" aria-current={isRouteActive('/help') ? 'page' : undefined} className={navLinkClass('/help')} onClick={closeMobileMenu}>
                    {t('Help', 'مساعدة', '帮助')}
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link href="/orders" aria-current={isRouteActive('/orders') ? 'page' : undefined} className={navLinkClass('/orders')} onClick={closeMobileMenu}>
                        {t('My Orders', 'طلباتي', '我的订单')}
                      </Link>
                      <Link href="/wallet" aria-current={isRouteActive('/wallet') ? 'page' : undefined} className={navLinkClass('/wallet')} onClick={closeMobileMenu}>
                        {t('Wallet', 'المحفظة', '钱包')}
                      </Link>
                    </>
                  )}
                  <Link href="/settings" aria-current={isRouteActive('/settings') ? 'page' : undefined} className={navLinkClass('/settings')} onClick={closeMobileMenu}>
                    {t('Settings', 'الإعدادات', '设置')}
                  </Link>
                </nav>

                <section className="mt-7 border-t border-black/10 pt-6 dark:border-white/10">
                  <div className="mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      {t('Language', 'اللغة', '语言')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {languageOptions.map((option) => (
                      <Button
                        key={option.id}
                        type="button"
                        size="sm"
                        variant={language === option.id ? 'default' : 'outline'}
                        onClick={() => setLanguage(option.id)}
                        className={language === option.id ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </section>

                <div className="mt-7 border-t border-black/10 pt-6 dark:border-white/10">
                  {isAccountLoading ? (
                    <div className="flex min-h-12 items-center gap-3 rounded-lg bg-zinc-100 px-4 text-sm text-zinc-600 dark:bg-white/5 dark:text-zinc-300" role="status">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 motion-reduce:animate-none" />
                      {t('Checking account...', 'جارٍ التحقق من الحساب...', '正在检查账号...')}
                    </div>
                  ) : isAuthenticated ? (
                    <div className="grid gap-2">
                      <Link href="/profile" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full justify-start">
                          <User className="h-4 w-4" />
                          {t('Profile', 'الملف الشخصي', '个人资料')}
                        </Button>
                      </Link>
                      <Button
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        variant="outline"
                        className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('Logout', 'تسجيل الخروج', '退出登录')}
                      </Button>
                    </div>
                  ) : (
                    <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700">
                      <Link href="/auth" onClick={closeMobileMenu}>
                        {t('Login', 'تسجيل الدخول', '登录')}
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="mx-auto flex min-h-11 min-w-0 items-center gap-2 lg:mx-0" aria-label={t('Al-Wasl Digital home', 'الرئيسية للوصول الرقمي', 'Al-Wasl 数字服务首页')}>
              <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
                <Image
                  src="/brand/alwasl-mark.jpg"
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="40px"
                  priority
                />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">
                  {t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t('WAHO top-ups', 'شحن WAHO', 'WAHO 充值')}
                </span>
              </span>
            </Link>

            <nav aria-label={t('Main navigation', 'التنقل الرئيسي', '主导航')} className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {[
                { href: '/', label: t('Home', 'الرئيسية', '首页') },
                { href: '/promotions', label: t('Offers', 'العروض', '优惠') },
                { href: '/help', label: t('Help', 'مساعدة', '帮助') },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isRouteActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors',
                    isRouteActive(item.href)
                      ? 'bg-zinc-100 text-zinc-950 dark:bg-white/10 dark:text-white'
                      : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="ms-2 bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/top-up/waho-top-up" aria-current={pathname.startsWith('/top-up') ? 'page' : undefined}>
                  <Zap className="h-4 w-4" />
                  {t('Top up WAHO', 'اشحن WAHO', '充值 WAHO')}
                </Link>
              </Button>
            </nav>

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <Button
                aria-label={theme === 'light'
                  ? t('Switch to dark mode', 'التبديل إلى الوضع الداكن', '切换到深色模式')
                  : t('Switch to light mode', 'التبديل إلى الوضع الفاتح', '切换到浅色模式')}
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label={t('Change language', 'تغيير اللغة', '切换语言')}
                    variant="ghost"
                    size="sm"
                    className="gap-1 px-2 sm:px-3"
                  >
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <span className="text-xs font-medium">{activeLanguage.short}</span>
                    <ChevronDown className="hidden h-3 w-3 text-zinc-400 sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languageOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => setLanguage(option.id)}
                      className={language === option.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {isAccountLoading ? (
                <span className="flex h-10 w-10 items-center justify-center" role="status" aria-label={t('Checking account', 'جارٍ التحقق من الحساب', '正在检查账号')}>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 motion-reduce:animate-none" />
                </span>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label={t('Open account menu', 'افتح قائمة الحساب', '打开账号菜单')} variant="ghost" size="icon">
                      <Avatar className="h-8 w-8 border border-black/10 dark:border-white/10">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-3">
                      <p className="truncate text-sm font-semibold">{user?.name}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.phone}</p>
                      <p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        {t('Wallet', 'المحفظة', '钱包')}: {formatLocalAmount(user?.walletBalance || 0)}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile"><User className="h-4 w-4" />{t('Profile', 'الملف الشخصي', '个人资料')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders"><History className="h-4 w-4" />{t('Order History', 'سجل الطلبات', '订单历史')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet"><Wallet className="h-4 w-4" />{t('Wallet', 'المحفظة', '钱包')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings"><Settings className="h-4 w-4" />{t('Settings', 'الإعدادات', '设置')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-300 dark:focus:bg-red-500/10">
                      <LogOut className="h-4 w-4" />
                      {t('Logout', 'تسجيل الخروج', '退出登录')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm" className="hidden bg-blue-600 text-white hover:bg-blue-700 sm:inline-flex">
                  <Link href="/auth">{t('Login', 'دخول', '登录')}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav
        data-mobile-tab-bar
        aria-label={t('Mobile navigation', 'التنقل عبر الهاتف', '移动导航')}
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-1">
          {mobileTabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                item.active
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5', item.active && 'fill-blue-100 dark:fill-blue-950')} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
