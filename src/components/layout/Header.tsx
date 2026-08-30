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
  ReceiptText,
  Settings,
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
    'flex min-h-11 items-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928]',
    isRouteActive(href)
      ? 'bg-[#f7b928] text-[#07152e]'
      : 'text-[#53627a] hover:bg-[#eef4fa] hover:text-[#07152e]'
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

  return (
    <>
      <header data-v2-header className="v2-brand-header sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid h-[66px] grid-cols-[90px_minmax(0,1fr)_90px] items-center gap-1 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-2 lg:flex lg:h-[68px] lg:gap-7">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  aria-label={t('Open menu', 'افتح القائمة', '打开菜单')}
                  variant="ghost"
                  size="icon"
                  className="text-[#07152e] hover:bg-[#eef4fa] hover:text-[#07152e] lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={dir === 'rtl' ? 'right' : 'left'}
                className="w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto border-[#d9e1ec] bg-white p-5 text-[#07152e]"
              >
                <SheetHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                  <SheetTitle className="text-[#07152e]">
                    {t('Menu', 'القائمة', '菜单')}
                  </SheetTitle>
                  <SheetDescription className="text-[#53627a]">
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
                  <Link href={protectedHref('/#categories')} aria-current={pathname.startsWith('/categories') || pathname.startsWith('/top-up') ? 'page' : undefined} className={navLinkClass('/top-up/waho-top-up')} onClick={closeMobileMenu}>
                    {t('Recharge categories', 'فئات الشحن', '充值分类')}
                  </Link>
                  <Link href={protectedHref('/promotions')} aria-current={isRouteActive('/promotions') ? 'page' : undefined} className={navLinkClass('/promotions')} onClick={closeMobileMenu}>
                    {t('Offers', 'العروض', '优惠')}
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
                  <Link href={protectedHref('/settings')} aria-current={isRouteActive('/settings') ? 'page' : undefined} className={navLinkClass('/settings')} onClick={closeMobileMenu}>
                    {t('Settings', 'الإعدادات', '设置')}
                  </Link>
                </nav>

                <section className="mt-7 border-t border-[#d9e1ec] pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#f7b928]" />
                    <h2 className="text-sm font-semibold text-[#07152e]">
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
                        className={language === option.id ? 'bg-[#f7b928] text-[#07152e] hover:bg-[#ffd05a]' : 'border-[#d9e1ec] bg-white text-[#07152e] hover:bg-[#eef4fa]'}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </section>

                <div className="mt-7 border-t border-[#d9e1ec] pt-6">
                  {isAccountLoading ? (
                    <div className="flex min-h-12 items-center gap-3 rounded-lg bg-[#eef4fa] px-4 text-sm text-[#53627a]" role="status">
                      <Loader2 className="h-4 w-4 animate-spin text-[#f7b928] motion-reduce:animate-none" />
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
                        className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('Logout', 'تسجيل الخروج', '退出登录')}
                      </Button>
                    </div>
                  ) : (
                    <Button asChild className="v2-primary-button w-full">
                      <Link href="/auth" onClick={closeMobileMenu}>
                        {t('Login', 'تسجيل الدخول', '登录')}
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link data-v2-mobile-brand href="/" className="mx-auto flex min-h-11 min-w-0 items-center gap-2 lg:mx-0" aria-label={t('Al-Wasl Digital home', 'الرئيسية للوصول الرقمي', 'Al-Wasl 数字服务首页')}>
              <span className="relative h-12 w-[68px] flex-shrink-0 overflow-hidden rounded-md border border-[#f7b928]/35 bg-white shadow-[0_8px_24px_rgba(28,55,92,0.14)] sm:h-11 sm:w-11 sm:rounded-lg sm:border-[#d9e1ec]">
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
                <span className="block truncate text-sm font-semibold text-[#07152e]">
                  {t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}
                </span>
                <span className="block text-[11px] text-[#53627a]">
                  {t('Digital recharge', 'شحن رقمي', '数字充值')}
                </span>
              </span>
            </Link>

            <nav aria-label={t('Main navigation', 'التنقل الرئيسي', '主导航')} className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {[
                { href: '/', label: t('Home', 'الرئيسية', '首页') },
                { href: protectedHref('/promotions'), label: t('Offers', 'العروض', '优惠') },
                { href: '/help', label: t('Help', 'مساعدة', '帮助') },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isRouteActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-11 items-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928]',
                    isRouteActive(item.href)
                      ? 'text-[#9b6800] after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-[#f7b928]'
                      : 'text-[#53627a] hover:bg-[#eef4fa] hover:text-[#07152e]'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="v2-primary-button ms-2">
                <Link href={protectedHref('/#categories')} aria-current={pathname.startsWith('/top-up') || pathname.startsWith('/categories') ? 'page' : undefined}>
                  <Zap className="h-4 w-4" />
                  {t('Choose category', 'اختر الفئة', '选择分类')}
                </Link>
              </Button>
            </nav>

            <div className="col-start-3 flex items-center justify-end gap-0.5 sm:gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label={t('Change language', 'تغيير اللغة', '切换语言')}
                    variant="ghost"
                    size="sm"
                    className="h-11 w-11 gap-0 px-0 text-[#53627a] hover:bg-[#eef4fa] hover:text-[#07152e] sm:w-auto sm:gap-1 sm:px-3"
                  >
                    <Globe className="h-4 w-4 text-[#f7b928]" />
                    <span className="sr-only sm:not-sr-only sm:text-xs sm:font-medium">{activeLanguage.short}</span>
                    <ChevronDown className="hidden h-3 w-3 text-[#7b8798] sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languageOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => setLanguage(option.id)}
                      className={language === option.id ? 'bg-[#f7b928]/15 text-[#815600]' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {isAccountLoading ? (
                <span className="flex h-10 w-10 items-center justify-center" role="status" aria-label={t('Checking account', 'جارٍ التحقق من الحساب', '正在检查账号')}>
                  <Loader2 className="h-4 w-4 animate-spin text-[#f7b928] motion-reduce:animate-none" />
                </span>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label={t('Open account menu', 'افتح قائمة الحساب', '打开账号菜单')} variant="ghost" size="icon" className="text-[#07152e] hover:bg-[#eef4fa]">
                      <Avatar className="h-8 w-8 border border-[#d9e1ec]">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-[#f7b928] text-xs font-semibold text-[#07152e]">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-3">
                      <p className="truncate text-sm font-semibold">{user?.name}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{user?.phone}</p>
                      <p className="mt-2 text-xs font-semibold text-blue-700">
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
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                      <LogOut className="h-4 w-4" />
                      {t('Logout', 'تسجيل الخروج', '退出登录')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm" className="v2-primary-button hidden sm:inline-flex">
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
        className="v2-mobile-navigation fixed inset-x-0 bottom-0 z-[60] border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {mobileTabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f7b928]',
                item.active
                  ? 'text-[#9b6800] after:absolute after:inset-x-5 after:top-0 after:h-0.5 after:bg-[#f7b928]'
                  : 'text-[#6b778a] hover:text-[#07152e]'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
