'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Gem } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import type { Game } from '@/types';

export default function TopUpPage() {
  const { t, dir, language, selectedCountry, formatLocalAmount } = useApp();
  const [wahoTopUp, setWahoTopUp] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const formatAmount = (amount: number) => new Intl.NumberFormat(locale).format(amount);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    async function loadProduct() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/waho-top-up?country=${selectedCountry.id}`, { signal: controller.signal });
        const payload = response.ok ? await response.json() : null;
        if (active) setWahoTopUp(payload?.product ?? null);
      } catch {
        if (active) setWahoTopUp(null);
      } finally {
        window.clearTimeout(timeoutId);
        if (active) setIsLoading(false);
      }
    }

    void loadProduct();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedCountry.id]);

  const topUpPackages = wahoTopUp?.packages.filter((item) => item.inStock) ?? [];

  return (
    <div data-v2-amount-overview className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {isLoading ? (
          <div role="status" className="mx-auto max-w-3xl py-10" aria-live="polite">
            <p className="mb-5 flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
              {t('Opening WAHO amounts...', 'جارٍ فتح مبالغ WAHO...', '正在打开 WAHO 金额...')}
            </p>
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-lg bg-white dark:bg-zinc-900" />
              ))}
            </div>
          </div>
        ) : !wahoTopUp ? (
          <section className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">
              {t('WAHO top-up is temporarily unavailable', 'شحن WAHO غير متاح مؤقتاً', 'WAHO 充值暂时不可用')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {t('We could not load the amounts. Try again in a moment.', 'تعذر تحميل المبالغ. حاول مرة أخرى بعد قليل.', '无法加载金额，请稍后重试。')}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.location.reload()} className="bg-blue-600 text-white hover:bg-blue-700">
                {t('Try again', 'حاول مرة أخرى', '重试')}
              </Button>
              <Button asChild variant="outline">
                <Link href="/">{t('Back home', 'العودة للرئيسية', '返回首页')}</Link>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('Back home', 'العودة للرئيسية', '返回首页')}
            </Link>

            <header className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--v2-gold)]">
                  <BadgeCheck className="h-4 w-4" />
                  {t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}
                </div>
                <h1 className="mt-3 text-3xl font-semibold leading-tight text-zinc-950 dark:text-white sm:text-4xl">
                  {t('Choose your WAHO amount', 'اختر مبلغ شحن WAHO', '选择 WAHO 充值金额')}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                  {t('Tap an amount to continue. You will check the WAHO account before payment.', 'اضغط على المبلغ للمتابعة. ستتحقق من حساب WAHO قبل الدفع.', '点击金额继续。付款前会先检查 WAHO 账号。')}
                </p>
              </div>
              <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/12 bg-[#06152f] shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
                <Image src="/brand/waho-app-icon.webp" alt="" fill className="object-cover" sizes="64px" priority />
              </div>
            </header>

            <section aria-labelledby="available-amounts" className="mt-8">
              <h2 id="available-amounts" className="sr-only">{t('Available amounts', 'المبالغ المتاحة', '可选金额')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {topUpPackages.map((pkg) => {
                  const amount = formatAmount(pkg.amount);
                  return (
                    <Link
                      key={pkg.id}
                      href={`/top-up/${wahoTopUp.slug}?amount=${pkg.amount}`}
                      aria-label={t(`Choose ${amount} IQD`, `اختر ${amount} د.ع`, `选择 ${amount} IQD`)}
                      className={`v2-overview-package group relative flex min-h-52 flex-col overflow-hidden rounded-lg border bg-[#06152f] p-3 text-white shadow-[0_16px_38px_rgba(0,0,0,0.2)] transition-colors hover:border-[var(--v2-gold)] hover:bg-[#0a2148] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)] ${
                        pkg.isPopular ? 'border-[var(--v2-gold)]' : 'border-white/12'
                      }`}
                    >
                      {pkg.isPopular && (
                        <span className="absolute end-3 top-3 rounded-full bg-[#ffd33d] px-2 py-1 text-[10px] font-semibold text-[#071b46]">
                          {t('Popular', 'الأكثر اختياراً', '热门')}
                        </span>
                      )}
                      <span className="flex flex-col items-start">
                        <span className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/12">
                          <Image data-visual-required-image src="/brand/waho-app-icon.webp" alt="" fill className="object-cover" sizes="40px" />
                        </span>
                        <span className="mt-4 block text-2xl font-semibold leading-none tabular-nums text-white">{amount}</span>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#b8c5db]">
                          <Gem className="h-3.5 w-3.5 text-[var(--v2-blue)]" />
                          {t('WAHO balance', 'رصيد WAHO', 'WAHO 余额')}
                        </span>
                        <span className="mt-3 text-[10px] text-[#b8c5db]">{t('You pay', 'تدفع', '您支付')}</span>
                        <span className="mt-1 text-xs font-bold tabular-nums text-[var(--v2-gold)]">
                          {formatLocalAmount(pkg.salePrice || pkg.basePrice)}
                        </span>
                      </span>
                      <span className="mt-4 flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-[var(--v2-gold)] px-2 text-xs font-bold text-[#07152e] group-hover:bg-[var(--v2-gold-hover)]">
                        {t('Choose amount', 'اختر المبلغ', '选择金额')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="v2-surface-raised mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-300" />
                {t('Not sure yet? Start without choosing an amount.', 'لست متأكداً؟ ابدأ دون اختيار مبلغ.', '还不确定？可以先开始，稍后再选金额。')}
              </div>
              <Link href={`/top-up/${wahoTopUp.slug}`} className="v2-primary-button">
                {t('Start top-up', 'ابدأ الشحن', '开始充值')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
