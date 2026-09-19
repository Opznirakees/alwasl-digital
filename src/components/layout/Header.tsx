'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronDown,
  Globe,
  History,
  Home,
  Loader2,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
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
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeLanguage = languageOptions.find((option) => option.id === language) ?? languageOptions[0];

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/top-up/waho-top-up') return pathname.startsWith('/top-up');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const protectedHref = (href: string) => isAuthenticated
    ? href
    : `/auth?next=${encodeURIComponent(href)}`;
  const navLinkClass = (href: string) => cn(
    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)]',
    isRouteActive(href)
      ? 'bg-[var(--v2-navy)] text-white'
      : 'text-[var(--v2-muted)] hover:bg-[var(--v2-navy-soft)] hover:text-[var(--v2-navy)]'
  );

  const mobileTabs = [
    { href: '/', label: t('Home', 'الرئيسية', '首页'), icon: Home, active: pathname === '/' },
    {
      href: protectedHref('/#categories'),
      label: t('Top up', 'اشحن', '充值'),
      icon: Zap,
      active: pathname.startsWith('/top-up'),
    },
    {
      href: protectedHref('/orders'),
      label: t('Orders', 'الطلبات', '订单'),
      icon: ReceiptText,
      active: pathname.startsWith('/orders'),
    },
    {
      href: protectedHref('/wallet'),
      label: t('Wallet', 'المحفظة', '钱包'),
      icon: Wallet,
      active: pathname.startsWith('/wallet'),
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

  const desktopLinks = [
    { href: '/', label: t('Home', 'الرئيسية', '首页') },
    { href: protectedHref('/promotions'), label: t('Offers', 'العروض', '优惠') },
    { href: '/help', label: t('Help', 'مساعدة', '帮助') },
  ];

  return (
    <>
      <header data-v2-header className="v2-brand-header sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <div className="v2-container">
          <div className="grid h-[68px] grid-cols-[90px_minmax(0,1fr)_90px] items-center gap-1 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-2 lg:flex lg:h-[72px] lg:gap-6">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  aria-label={t('Open menu', 'افتح القائمة', '打开菜单')}
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-[var(--v2-navy)] hover:bg-[var(--v2-navy-soft)] hover:text-[var(--v2-navy)] lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={dir === 'rtl' ? 'right' : 'left'}
                className="w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto border-[var(--v2-border)] bg-white p-5 text-[var(--v2-navy)]"
              >
                <SheetHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                  <div className="flex items-center gap-3">
                    <span className="relative h-11 w-11 overflow-hidden rounded-xl border border-[var(--v2-border)] bg-white shadow-[var(--v2-shadow-xs)]">
                      <Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="44px" />
                    </span>
                    <div>
                      <SheetTitle className="text-base text-[var(--v2-navy)]">
                        {t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}
                      </SheetTitle>
                      <SheetDescription className="text-xs text-[var(--v2-muted)]">
                        {t(
                          mobileMenuSheetCopy.description.en,
                          mobileMenuSheetCopy.description.ar,
                          mobileMenuSheetCopy.description.zh
                        )}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <nav aria-label={t('Main menu', 'القائمة الرئيسية', '主菜单')} className="mt-7 grid gap-1">
                  <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={navLinkClass('/')} onClick={closeMobileMenu}>
                    <Home className="h-4 w-4 opacity-70" />
                    {t('Home', 'الرئيسية', '首页')}
                  </Link>
                  <Link href={protectedHref('/#categories')} aria-current={pathname.startsWith('/categories') || pathname.startsWith('/top-up') ? 'page' : undefined} className={navLinkClass('/top-up/waho-top-up')} onClick={closeMobileMenu}>
                    <Zap className="h-4 w-4 opacity-70" />
                    {t('Recharge categories', 'فئات الشحن', '充值分类')}
                  </Link>
                  <Link href={protectedHref('/promotions')} aria-current={isRouteActive('/promotions') ? 'page' : undefined} className={navLinkClass('/promotions')} onClick={closeMobileMenu}>
                    <Sparkles className="h-4 w-4 opacity-70" />
                    {t('Offers', 'العروض', '优惠')}
                  </Link>
                  <Link href="/help" aria-current={isRouteActive('/help') ? 'page' : undefined} className={navLinkClass('/help')} onClick={closeMobileMenu}>
                    <History className="h-4 w-4 opacity-70" />
                    {t('Help', 'مساعدة', '帮助')}
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link href="/orders" aria-current={isRouteActive('/orders') ? 'page' : undefined} className={navLinkClass('/orders')} onClick={closeMobileMenu}>
                        <ReceiptText className="h-4 w-4 opacity-70" />
                        {t('My Orders', 'طلباتي', '我的订单')}
                      </Link>
                      <Link href="/wallet" aria-current={isRouteActive('/wallet') ? 'page' : undefined} className={navLinkClass('/wallet')} onClick={closeMobileMenu}>
                        <Wallet className="h-4 w-4 opacity-70" />
                        {t('Wallet', 'المحفظة', '钱包')}
                      </Link>
                    </>
                  )}
                  <Link href={protectedHref('/settings')} aria-current={isRouteActive('/settings') ? 'page' : undefined} className={navLinkClass('/settings')} onClick={closeMobileMenu}>
                    <Settings className="h-4 w-4 opacity-70" />
                    {t('Settings', 'الإعدادات', '设置')}
                  </Link>
                </nav>

                <section className="mt-7 border-t border-[var(--v2-border)] pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[var(--v2-gold-deep)]" />
                    <h2 className="text-sm font-semibold text-[var(--v2-navy)]">
                      {t('Language', 'اللغة', '语言')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--v2-surface-raised)] p-1">
                    {languageOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setLanguage(option.id)}
                        aria-pressed={language === option.id}
                        className={cn(
                          'min-h-10 rounded-lg text-sm font-semibold transition-colors',
                          language === option.id
                            ? 'bg-white text-[var(--v2-navy)] shadow-[var(--v2-shadow-xs)]'
                            : 'text-[var(--v2-muted)] hover:text-[var(--v2-navy)]'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="mt-7 border-t border-[var(--v2-border)] pt-6">
                  {isAccountLoading ? (
                    <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[var(--v2-surface-raised)] px-4 text-sm text-[var(--v2-muted)]" role="status">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--v2-gold-deep)] motion-reduce:animate-none" />
                      {t('Checking account...', 'جارٍ التحقق من الحساب...', '正在检查账号...')}
                    </div>
                  ) : isAuthenticated ? (
                    <div className="grid gap-2">
                      <div className="flex items-center gap-3 rounded-xl bg-[var(--v2-surface-raised)] p-3">
                        <Avatar className="h-10 w-10 border border-white shadow-[var(--v2-shadow-xs)]">
                          <AvatarImage src={user?.avatar} alt={user?.name} />
                          <AvatarFallback className="bg-[var(--v2-gold)] text-sm font-bold text-[var(--v2-navy)]">
                            {user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--v2-navy)]">{user?.name}</p>
                          <p className="truncate text-xs text-[var(--v2-muted)]">{formatLocalAmount(user?.walletBalance || 0)}</p>
                        </div>
                      </div>
                      <Link href="/profile" onClick={closeMobileMenu} className="v2-secondary-button min-h-11 justify-start">
                        <User className="h-4 w-4" />
                        {t('Profile', 'الملف الشخصي', '个人资料')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="v2-secondary-button min-h-11 justify-start border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('Logout', 'تسجيل الخروج', '退出登录')}
                      </button>
                    </div>
                  ) : (
                    <Link href="/auth" onClick={closeMobileMenu} className="v2-primary-button w-full">
                      {t('Login', 'تسجيل الدخول', '登录')}
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link data-v2-mobile-brand href="/" className="mx-auto flex min-h-11 min-w-0 items-center gap-2.5 lg:mx-0" aria-label={t('Al-Wasl Digital home', 'الرئيسية للوصول الرقمي', 'Al-Wasl 数字服务首页')}>
              <span className="relative h-12 w-[68px] flex-shrink-0 overflow-hidden rounded-xl border border-[var(--v2-gold)]/40 bg-white shadow-[var(--v2-shadow-sm)] sm:h-11 sm:w-11 sm:border-[var(--v2-border)]">
                <Image
                  src="/brand/alwasl-lockup.webp"
                  alt=""
                  fill
                  className="object-contain px-2 py-1 sm:hidden"
                  sizes="68px"
                  priority
                />
                <Image
                  src="/brand/alwasl-mark.jpg"
                  alt=""
                  fill
                  className="hidden object-contain p-1 sm:block"
                  sizes="44px"
                  priority
                />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-[15px] font-bold tracking-tight text-[var(--v2-navy)]">
                  {t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}
                </span>
                <span className="block text-[11px] font-medium text-[var(--v2-muted)]">
                  {t('Digital recharge', 'شحن رقمي', '数字充值')}
                </span>
              </span>
            </Link>

            <nav aria-label={t('Main navigation', 'التنقل الرئيسي', '主导航')} className="hidden flex-1 items-center justify-center lg:flex">
              <div className="flex items-center gap-1 rounded-full border border-[var(--v2-border)] bg-[var(--v2-surface-raised)]/70 p-1">
                {desktopLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isRouteActive(item.href) ? 'page' : undefined}
                    className="v2-nav-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="col-start-3 flex items-center justify-end gap-1 sm:gap-2">
              <Link
                href={protectedHref('/#categories')}
                aria-current={pathname.startsWith('/top-up') || pathname.startsWith('/categories') ? 'page' : undefined}
                className="v2-primary-button hidden min-h-10 px-4 text-sm lg:inline-flex"
              >
                <Zap className="h-4 w-4" />
                {t('Choose category', 'اختر الفئة', '选择分类')}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label={t('Change language', 'تغيير اللغة', '切换语言')}
                    variant="ghost"
                    size="sm"
                    className="h-11 w-11 gap-0 rounded-full px-0 text-[var(--v2-muted)] hover:bg-[var(--v2-navy-soft)] hover:text-[var(--v2-navy)] sm:w-auto sm:gap-1.5 sm:px-3"
                  >
                    <Globe className="h-4 w-4 text-[var(--v2-gold-deep)]" />
                    <span className="sr-only sm:not-sr-only sm:text-xs sm:font-semibold">{activeLanguage.short}</span>
                    <ChevronDown className="hidden h-3 w-3 text-[var(--v2-subtle)] sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem] rounded-xl p-1.5">
                  {languageOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => setLanguage(option.id)}
                      className={cn('min-h-10 rounded-lg', language === option.id && 'bg-[var(--v2-gold-soft)] font-semibold text-[var(--v2-gold-deep)]')}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {isAccountLoading ? (
                <span className="flex h-11 w-11 items-center justify-center" role="status" aria-label={t('Checking account', 'جارٍ التحقق من الحساب', '正在检查账号')}>
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--v2-gold-deep)] motion-reduce:animate-none" />
                </span>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label={t('Open account menu', 'افتح قائمة الحساب', '打开账号菜单')} variant="ghost" size="icon" className="rounded-full text-[var(--v2-navy)] hover:bg-[var(--v2-navy-soft)]">
                      <Avatar className="h-9 w-9 border-2 border-white shadow-[var(--v2-shadow-sm)]">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-[var(--v2-gold)] text-xs font-bold text-[var(--v2-navy)]">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
                    <div className="rounded-lg bg-[var(--v2-surface-raised)] px-3 py-3">
                      <p className="truncate text-sm font-semibold text-[var(--v2-navy)]">{user?.name}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--v2-muted)]">{user?.phone}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--v2-gold-deep)]">
                        <Wallet className="h-3.5 w-3.5" />
                        {t('Wallet', 'المحفظة', '钱包')}: {formatLocalAmount(user?.walletBalance || 0)}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="min-h-10 rounded-lg">
                      <Link href="/profile"><User className="h-4 w-4" />{t('Profile', 'الملف الشخصي', '个人资料')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-10 rounded-lg">
                      <Link href="/orders"><History className="h-4 w-4" />{t('Order History', 'سجل الطلبات', '订单历史')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-10 rounded-lg">
                      <Link href="/wallet"><Wallet className="h-4 w-4" />{t('Wallet', 'المحفظة', '钱包')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-10 rounded-lg">
                      <Link href="/settings"><Settings className="h-4 w-4" />{t('Settings', 'الإعدادات', '设置')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="min-h-10 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600">
                      <LogOut className="h-4 w-4" />
                      {t('Logout', 'تسجيل الخروج', '退出登录')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth" className="v2-secondary-button hidden min-h-10 px-4 text-sm sm:inline-flex">
                  {t('Login', 'دخول', '登录')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav
        data-mobile-tab-bar
        aria-label={t('Mobile navigation', 'التنقل عبر الهاتف', '移动导航')}
        className="v2-mobile-navigation fixed inset-x-0 bottom-0 z-[60] border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {mobileTabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className="v2-mobile-tab"
            >
              <item.icon />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
