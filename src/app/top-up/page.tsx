'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import type { Game } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function TopUpPage() {
  const { t, dir, language } = useApp();
  const [wahoTopUp, setWahoTopUp] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const formatAmount = (amount: number) => new Intl.NumberFormat(locale).format(amount);
  const topUpIconSrc = '/brand/alwasl-mark.jpg';

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      const response = await fetch('/api/products/waho-top-up');
      if (response.ok) {
        const payload = await response.json();
        if (active) setWahoTopUp(payload.product);
      }
      if (active) setIsLoading(false);
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, []);

  const topUpPackages = wahoTopUp?.packages.filter((pkg) => pkg.inStock) ?? [];

  return (
    <div className={`min-h-screen bg-[#f5f5f7] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        {isLoading || !wahoTopUp ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
        <div className="mb-8">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-300">
            <ArrowLeft className="h-4 w-4" />
            {t('Back to Home', 'العودة للرئيسية', '返回首页')}
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-white">
            {t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {t(
              'One clear recharge flow: choose the IQD amount, confirm the WAHO ID, and continue to secure payment.',
              'مسار شحن واضح واحد: اختر مبلغ الدينار، أكد معرف WAHO، ثم تابع إلى الدفع الآمن.',
              '一个清晰的充值流程：选择 IQD 金额，确认 WAHO ID，然后安全支付。'
            )}
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 md:p-6">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-950">
                <Image
                  src={topUpIconSrc}
                  alt={t(wahoTopUp.name, wahoTopUp.nameAr, 'WAHO 账号充值')}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                  priority
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('Focused on WAHO only', 'مخصص لشحن WAHO فقط', '仅专注 WAHO')}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-zinc-950 dark:text-white">
                  {t(wahoTopUp.name, wahoTopUp.nameAr, 'WAHO 账号充值')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {t(wahoTopUp.description, wahoTopUp.descriptionAr, '输入 WAHO ID，选择金额并安全支付，即可充值 WAHO 账号余额。')}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                t('Choose from the available IQD top-up amounts.', 'اختر من مبالغ الشحن المتاحة بالدينار العراقي.', '从可用的 IQD 充值金额中选择。'),
                t('Check the WAHO ID before payment.', 'تحقق من معرف WAHO قبل الدفع.', '付款前检查 WAHO ID。'),
                t('Continue directly to checkout and order tracking.', 'تابع مباشرة إلى الدفع وتتبع الطلب.', '直接继续结账并跟踪订单。'),
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
                  {t('Available top-up amounts', 'مبالغ الشحن المتاحة', '可选充值金额')}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {t('Open the recharge flow and choose the exact IQD value there.', 'افتح مسار الشحن واختر قيمة الدينار المناسبة هناك.', '打开充值流程，并在那里选择准确的 IQD 金额。')}
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                {t('Fast top-up', 'شحن سريع', '快速充值')}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {topUpPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/top-up/${wahoTopUp.slug}`}
                  className="group rounded-lg border border-black/10 bg-zinc-50 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-blue-300/60 dark:hover:bg-blue-950/30"
                >
                  <p className="text-2xl font-semibold text-zinc-950 dark:text-white">
                    {formatAmount(pkg.amount)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                    {t(pkg.unit, pkg.unitAr, 'IQD 充值')}
                  </p>
                  {pkg.isPopular && (
                    <span className="mt-3 inline-flex rounded-md bg-[#ffcc00] px-2 py-1 text-[10px] font-semibold text-zinc-950">
                      {t('Popular', 'الأكثر شراءً', '热门')}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <Button asChild className="mt-6 w-full bg-blue-600 text-white shadow-none hover:bg-blue-700">
              <Link href={`/top-up/${wahoTopUp.slug}`}>
                {t('Start top-up', 'ابدأ الشحن', '开始充值')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
