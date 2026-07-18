'use client';

import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';

export function AccountPageLoading() {
  const { t, dir } = useApp();

  return (
    <div className={`min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 motion-reduce:animate-none" />
          {t('Opening your account...', 'جارٍ فتح حسابك...', '正在打开您的账号...')}
        </div>
        <div className="mt-6 h-10 w-48 animate-pulse rounded bg-zinc-200 motion-reduce:animate-none dark:bg-zinc-800" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-44 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-zinc-900" />
          <div className="h-44 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-zinc-900" />
        </div>
      </main>
    </div>
  );
}
