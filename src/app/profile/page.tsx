'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Wallet,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { AccountPageLoading } from '@/components/account/AccountPageLoading';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { resolveMembershipForSpend } from '@/lib/membership';

export default function ProfilePage() {
  const { t, dir, user, isAccountLoading, formatLocalAmount } = useApp();

  if (isAccountLoading) return <AccountPageLoading />;

  if (!user) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">
            {t('Log in to see your account', 'سجل الدخول لرؤية حسابك', '登录后查看您的账号')}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {t('Your orders, wallet and account details stay together here.', 'تجد طلباتك ومحفظتك وبيانات حسابك هنا.', '您的订单、钱包和账号资料都集中在这里。')}
          </p>
          <Button asChild className="mt-5 bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/auth?next=%2Fprofile">
              {t('Log in', 'تسجيل الدخول', '登录')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const level = resolveMembershipForSpend(user.totalSpent);
  const displayName = user.name || t('WAHO customer', 'عميل WAHO', 'WAHO 用户');
  const initials = displayName.trim().charAt(0).toUpperCase() || 'W';

  const accountDetails = [
    {
      icon: Phone,
      label: t('Phone number', 'رقم الهاتف', '手机号码'),
      value: user.phone,
    },
    {
      icon: Mail,
      label: t('Email address', 'البريد الإلكتروني', '电子邮箱'),
      value: user.email || t('Not added', 'غير مضاف', '尚未添加'),
    },
    {
      icon: CheckCircle2,
      label: t('Account check', 'حالة الحساب', '账号状态'),
      value: user.isVerified ? t('Verified', 'موثق', '已验证') : t('Needs verification', 'يحتاج إلى توثيق', '需要验证'),
    },
  ];

  const shortcuts = [
    {
      href: '/orders',
      icon: ReceiptText,
      title: t('My orders', 'طلباتي', '我的订单'),
      description: t('Follow every recharge order.', 'تابع كل طلب شحن.', '查看每一笔充值订单。'),
    },
    {
      href: '/wallet',
      icon: Wallet,
      title: t('My wallet', 'محفظتي', '我的钱包'),
      description: t('See your balance and activity.', 'شاهد الرصيد والمعاملات.', '查看余额和交易记录。'),
    },
    {
      href: '/settings',
      icon: Settings,
      title: t('Settings', 'الإعدادات', '设置'),
      description: t('Choose language and country.', 'اختر اللغة والبلد.', '选择语言和国家/地区。'),
    },
  ];

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="mt-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Your account', 'حسابك', '您的账号')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white sm:text-4xl">{t('Account overview', 'نظرة عامة على الحساب', '账号概览')}</h1>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#071b46] text-2xl font-semibold text-white">
              {initials}
            </div>
            <h2 className="mt-4 break-words text-xl font-semibold text-zinc-950 dark:text-white">{displayName}</h2>
            <p className="mt-1 break-all text-sm text-zinc-500 dark:text-zinc-400" dir="ltr">{user.phone}</p>

            <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#fff8dd] p-3 dark:bg-[#ffd33d]/10">
              <Star className="h-5 w-5 flex-shrink-0 text-[#8a5a00] dark:text-[#ffd966]" />
              <div className="min-w-0">
                <p className="text-xs text-[#765600] dark:text-[#ffe89a]">{t('Membership', 'العضوية', '会员等级')}</p>
                <p className="truncate text-sm font-semibold text-[#4b3600] dark:text-white">{t(level.en, level.ar, level.zh)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('Wallet balance', 'رصيد المحفظة', '钱包余额')}</p>
              <p className="mt-1 break-words text-xl font-semibold tabular-nums text-zinc-950 dark:text-white">{formatLocalAmount(user.walletBalance)}</p>
            </div>
          </section>

          <div className="min-w-0 space-y-5">
            <section className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">{t('Account details', 'بيانات الحساب', '账号资料')}</h2>
              <dl className="mt-4 divide-y divide-black/10 dark:divide-white/10">
                {accountDetails.map((item) => (
                  <div key={item.label} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <item.icon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                      {item.label}
                    </dt>
                    <dd className="break-words text-sm font-medium text-zinc-950 dark:text-white sm:text-end" dir={item.icon === Phone ? 'ltr' : undefined}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="account-shortcuts" className="grid gap-3 sm:grid-cols-3">
              <h2 id="account-shortcuts" className="sr-only">{t('Account shortcuts', 'اختصارات الحساب', '账号快捷入口')}</h2>
              {shortcuts.map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} className="group flex min-h-36 flex-col rounded-lg border border-black/10 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><shortcut.icon className="h-5 w-5" /></span>
                  <span className="mt-3 flex items-center justify-between gap-2 font-semibold text-zinc-950 dark:text-white">
                    {shortcut.title}
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </span>
                  <span className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{shortcut.description}</span>
                </Link>
              ))}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
