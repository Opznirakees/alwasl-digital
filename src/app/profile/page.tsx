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
  UserRound,
  Wallet,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { AccountPageLoading } from '@/components/account/AccountPageLoading';
import { useApp } from '@/contexts/AppContext';
import { resolveMembershipForSpend } from '@/lib/membership';

export default function ProfilePage() {
  const { t, dir, user, isAccountLoading, formatLocalAmount } = useApp();

  if (isAccountLoading) return <AccountPageLoading />;

  if (!user) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="v2-container flex min-h-[65vh] max-w-xl flex-col items-center justify-center py-10 text-center">
          <section className="v2-surface flex w-full flex-col items-center p-6 sm:p-8">
            <span className="v2-icon-tile v2-icon-tile-gold h-14 w-14 rounded-2xl">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--v2-navy)]">
              {t('Log in to see your account', 'سجل الدخول لرؤية حسابك', '登录后查看您的账号')}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--v2-muted)]">
              {t('Your orders, wallet and account details stay together here.', 'تجد طلباتك ومحفظتك وبيانات حسابك هنا.', '您的订单、钱包和账号资料都集中在这里。')}
            </p>
            <Link href="/auth?next=%2Fprofile" className="v2-primary-button mt-6 w-full sm:w-auto">
              {t('Log in', 'تسجيل الدخول', '登录')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </section>
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

      <main className="v2-container max-w-5xl py-6 pb-24 sm:py-10 lg:pb-10">
        <Link href="/" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="v2-page-header mt-4">
          <p className="v2-kicker">{t('Your account', 'حسابك', '您的账号')}</p>
          <h1>{t('Account overview', 'نظرة عامة على الحساب', '账号概览')}</h1>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="v2-surface p-5 sm:p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--v2-gold)] text-2xl font-extrabold text-[var(--v2-navy)] shadow-[var(--v2-shadow-sm)]">
              {initials}
            </div>
            <h2 className="mt-4 break-words text-xl font-bold text-[var(--v2-navy)]">{displayName}</h2>
            <p className="mt-1 break-all text-sm text-[var(--v2-muted)]" dir="ltr">{user.phone}</p>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-[var(--v2-gold-soft)] p-3">
              <Star className="h-5 w-5 flex-shrink-0 text-[var(--v2-gold-deep)]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--v2-gold-deep)]">{t('Membership', 'العضوية', '会员等级')}</p>
                <p className="truncate text-sm font-bold text-[var(--v2-navy)]">{t(level.en, level.ar, level.zh)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--v2-border)] pt-4">
              <p className="text-xs font-semibold text-[var(--v2-subtle)]">{t('Wallet balance', 'رصيد المحفظة', '钱包余额')}</p>
              <p className="mt-1 break-words text-xl font-extrabold tabular-nums tracking-tight text-[var(--v2-navy)]">{formatLocalAmount(user.walletBalance)}</p>
            </div>
          </section>

          <div className="min-w-0 space-y-5">
            <section className="v2-surface p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="v2-icon-tile v2-icon-tile-blue"><UserRound className="h-5 w-5" /></span>
                <h2 className="text-base font-bold text-[var(--v2-navy)]">{t('Account details', 'بيانات الحساب', '账号资料')}</h2>
              </div>
              <dl className="mt-4 divide-y divide-[var(--v2-border)]">
                {accountDetails.map((item) => (
                  <div key={item.label} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-[var(--v2-muted)]">
                      <item.icon className="h-4 w-4 text-[var(--v2-gold-deep)]" />
                      {item.label}
                    </dt>
                    <dd className="break-words text-sm font-semibold text-[var(--v2-navy)] sm:text-end" dir={item.icon === Phone ? 'ltr' : undefined}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="account-shortcuts" className="grid gap-3 sm:grid-cols-3">
              <h2 id="account-shortcuts" className="sr-only">{t('Account shortcuts', 'اختصارات الحساب', '账号快捷入口')}</h2>
              {shortcuts.map((shortcut) => (
                <Link key={shortcut.href} href={shortcut.href} className="v2-surface v2-card-interactive group flex min-h-36 flex-col p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)]">
                  <span className="v2-icon-tile v2-icon-tile-gold"><shortcut.icon className="h-5 w-5" /></span>
                  <span className="mt-3 flex items-center justify-between gap-2 font-bold text-[var(--v2-navy)]">
                    {shortcut.title}
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--v2-subtle)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </span>
                  <span className="mt-1 text-xs leading-5 text-[var(--v2-muted)]">{shortcut.description}</span>
                </Link>
              ))}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
