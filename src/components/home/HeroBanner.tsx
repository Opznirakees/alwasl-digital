'use client';

import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export function HeroBanner() {
  const { t, dir } = useApp();
  const previewAmounts = ['5,000', '10,000', '25,000'];
  const previewSteps = [
    {
      icon: Wallet,
      title: t('Choose amount', 'اختر المبلغ', '选择金额'),
      body: t('Pick the IQD value', 'اختر مبلغ الدينار', '选择 IQD 金额'),
    },
    {
      icon: BadgeCheck,
      title: t('Check WAHO ID', 'تحقق من معرف WAHO', '检查 WAHO ID'),
      body: t('Confirm the account first', 'أكد الحساب أولاً', '先确认账号'),
    },
    {
      icon: CreditCard,
      title: t('Pay securely', 'ادفع بأمان', '安全付款'),
      body: t('Track with order ID', 'تابع برقم الطلب', '用订单号跟踪'),
    },
  ];

  return (
    <section className="grid items-center gap-8 py-4 md:grid-cols-[1fr_0.9fr] md:gap-12 md:py-8 lg:min-h-[460px]">
      <div className={`min-w-0 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
            {t('Fast WAHO top-ups', 'شحن WAHO سريع', '快速 WAHO 充值')}
        </div>

        <h2 className="mt-5 max-w-3xl break-words text-4xl font-semibold leading-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
          {t('Top up WAHO in a few clear steps', 'اشحن WAHO بخطوات واضحة وسريعة', '几步即可快速充值 WAHO')}
        </h2>

        <p className="mt-5 max-w-2xl break-words text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
          {t(
            'Enter the WAHO ID, choose the top-up amount, confirm the account, and pay securely.',
            'أدخل معرف WAHO واختر مبلغ الشحن وتأكد من الحساب وادفع بأمان.',
            '输入 WAHO ID，选择充值金额，确认账号并安全支付。'
          )}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/top-up">
            <Button
              size="lg"
              className="w-full rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-none hover:bg-blue-700 sm:w-auto"
            >
              {t('Top up WAHO', 'اشحن WAHO', '充值 WAHO')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link
            href="/help"
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/10"
          >
            {t('How it works', 'كيف تعمل الخدمة', '服务流程')}
          </Link>
        </div>

        <div className="mt-8 grid max-w-xl grid-cols-1 gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-3">
          {[
            t('Trusted delivery', 'تسليم موثوق', '可靠交付'),
            t('Fast top-up', 'شحن سريع', '快速充值'),
            t('24/7 support', 'دعم 24/7', '24/7 支持'),
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                W
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-blue-600 dark:text-blue-300">WAHO</p>
                <p className="text-lg font-semibold leading-tight text-zinc-950 dark:text-white">
                  {t('Account top-up', 'شحن الحساب', '账号充值')}
                </p>
              </div>
            </div>
            <span className="rounded-md bg-[#34c759]/10 px-2.5 py-1 text-xs font-semibold text-[#1f8f3a] ring-1 ring-[#34c759]/25">
              {t('Ready', 'جاهز', '就绪')}
            </span>
          </div>

          <div className="mt-5 rounded-lg bg-zinc-50 p-4 ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('WAHO ID', 'معرف WAHO', 'WAHO ID')}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-zinc-950 dark:text-white">9842 **** 31</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-black/10 dark:bg-zinc-900 dark:text-blue-300 dark:ring-white/10">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t('Checked', 'تم التحقق', '已检查')}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {previewAmounts.map((amount) => (
                <div key={amount} className="rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
                  <p className="text-lg font-semibold leading-none text-zinc-950 dark:text-white">{amount}</p>
                  <p className="mt-1.5 text-xs font-medium text-blue-600 dark:text-blue-300">
                    {t('IQD', 'د.ع', 'IQD')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {previewSteps.map((item) => (
              <div key={item.title} className="rounded-md bg-zinc-50 p-3 ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/10">
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-white text-blue-600 ring-1 ring-black/10 dark:bg-zinc-900 dark:text-blue-300 dark:ring-white/10">
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-zinc-950 p-3 text-white dark:border-white/10">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-blue-300" />
              <span className="text-xs font-medium text-zinc-100">{t('Order ID after payment', 'رقم الطلب بعد الدفع', '付款后生成订单号')}</span>
            </div>
            <CheckCircle2 className="h-4 w-4 text-[#34c759]" />
          </div>
        </div>
      </div>
    </section>
  );
}
