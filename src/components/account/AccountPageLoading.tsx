'use client';

import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';

export function AccountPageLoading() {
  const { t, dir } = useApp();

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="v2-container max-w-5xl py-6 pb-24 sm:py-10 lg:pb-10" role="status" aria-live="polite">
        <div className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[var(--v2-muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--v2-gold-deep)] motion-reduce:animate-none" />
          {t('Opening your account...', 'جارٍ فتح حسابك...', '正在打开您的账号...')}
        </div>
        <div className="v2-skeleton mt-6 h-4 w-28 motion-reduce:animate-none" />
        <div className="v2-skeleton mt-3 h-10 w-56 motion-reduce:animate-none" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="v2-skeleton h-44 rounded-2xl motion-reduce:animate-none" />
          <div className="v2-skeleton h-44 rounded-2xl motion-reduce:animate-none" />
        </div>
      </main>
    </div>
  );
}
