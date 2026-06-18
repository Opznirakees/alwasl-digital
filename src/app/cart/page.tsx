'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export default function CartPage() {
  const { t, dir } = useApp();

  return (
    <div className={`min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link href="/top-up" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4" />
          {t('Continue top-up', 'متابعة الشحن', '继续充值')}
        </Link>

        <section className="mx-auto max-w-2xl rounded-lg border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900 md:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">
            {t('Go directly to WAHO top-up', 'انتقل مباشرة إلى شحن WAHO', '直接前往 WAHO 充值')}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {t(
              'Choose the IQD amount, enter the WAHO ID, and continue to payment from one focused flow.',
              'اختر مبلغ الدينار وأدخل معرف WAHO ثم تابع الدفع من مسار واحد واضح.',
              '选择 IQD 金额，输入 WAHO ID，然后在一个清晰流程中继续付款。'
            )}
          </p>

          <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
            {[
              t('Select amount', 'اختر المبلغ', '选择金额'),
              t('Confirm WAHO ID', 'أكد معرف WAHO', '确认 WAHO ID'),
              t('Track order', 'تابع الطلب', '跟踪订单'),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-md bg-zinc-50 p-3 text-sm font-medium text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Button asChild className="mt-7 bg-blue-600 text-white shadow-none hover:bg-blue-700">
            <Link href="/top-up/waho-top-up">
              {t('Start top-up', 'ابدأ الشحن', '开始充值')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
