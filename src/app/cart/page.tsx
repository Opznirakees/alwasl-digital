'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';

export default function CartPage() {
  const { t, dir } = useApp();

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="v2-container max-w-3xl py-6 pb-24 sm:py-10 lg:pb-10">
        <Link href="/top-up" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Continue top-up', 'متابعة الشحن', '继续充值')}
        </Link>

        <section className="v2-surface mx-auto mt-4 max-w-2xl p-6 text-center sm:p-8">
          <div className="v2-icon-tile v2-icon-tile-gold mx-auto h-14 w-14 rounded-2xl">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--v2-navy)] sm:text-3xl">
            {t('Choose what you want to recharge', 'اختر ما تريد شحنه', '选择您要充值的内容')}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--v2-muted)]">
            {t(
              'Choose a category, log in securely and see the amounts available for your country.',
              'اختر الفئة وسجل الدخول بأمان وشاهد المبالغ المتاحة لبلدك.',
              '选择分类，安全登录，并查看您所在国家/地区可用的金额。'
            )}
          </p>

          <div className="mt-6 grid gap-2 text-start sm:grid-cols-3">
            {[
              t('Choose category', 'اختر الفئة', '选择分类'),
              t('Select amount', 'اختر المبلغ', '选择金额'),
              t('Track order', 'تابع الطلب', '跟踪订单'),
            ].map((item) => (
              <div key={item} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--v2-surface-raised)] p-3 text-sm font-semibold text-[var(--v2-navy)]">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[var(--v2-green)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link href="/#categories" className="v2-primary-button mt-7 w-full sm:w-auto">
            {t('View categories', 'عرض الفئات', '查看分类')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </section>
      </main>
    </div>
  );
}
