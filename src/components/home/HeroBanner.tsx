'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CircleHelp, ShieldCheck } from 'lucide-react';
import type { Banner } from '@/types';
import { useApp } from '@/contexts/AppContext';

interface HeroBannerProps {
  banner?: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const { t, dir } = useApp();

  return (
    <section
      aria-label={banner ? t(banner.title, banner.titleAr, banner.title) : undefined}
      className="relative min-h-[620px] overflow-hidden rounded-lg bg-[#071b46] text-white shadow-[0_24px_80px_rgba(7,27,70,0.18)] sm:min-h-[540px]"
    >
      <Image
        src="/brand/leo-waho-agent.jpeg"
        alt={t('LEO, WAHO top-up contact', 'LEO، جهة التواصل لشحن WAHO', 'LEO，WAHO 充值联系人')}
        fill
        priority
        className="object-cover object-[58%_30%] sm:object-[62%_32%] lg:object-[72%_35%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[#071b46]/80" />

      <div className="relative z-10 flex min-h-[620px] items-center p-6 pb-24 sm:min-h-[540px] sm:p-10 sm:pb-24 lg:p-14">
        <div className={dir === 'rtl' ? 'max-w-2xl text-right' : 'max-w-2xl'}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-[#ffd33d]" />
            {t('WAHO balance top-up', 'شحن رصيد WAHO', 'WAHO 余额充值')}
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            {t('Top up your WAHO balance', 'اشحن رصيد WAHO', '为您的 WAHO 余额充值')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-blue-50/80 sm:text-lg">
            {t(
              'Choose an amount, enter the WAHO ID, and follow your order. That is all you need.',
              'اختر المبلغ وأدخل معرف WAHO ثم تابع طلبك. هذا كل ما تحتاجه.',
              '选择金额，输入 WAHO ID，然后跟踪订单。只需这几步。'
            )}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              data-testid="home-primary-topup"
              href="/top-up/waho-top-up"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#071b46] transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b46]"
            >
              {t('Choose amount', 'اختر المبلغ', '选择金额')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/help"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CircleHelp className="h-4 w-4" />
              {t('How it works', 'كيف يعمل', '如何操作')}
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-blue-50/75 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[#ffd33d]" />
              {t('WAHO ID checked first', 'فحص معرف WAHO أولاً', '先检查 WAHO ID')}
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[#ffd33d]" />
              {t('Order ID after confirmation', 'رقم طلب بعد التأكيد', '确认后生成订单号')}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/15 bg-black/45 px-6 py-4 backdrop-blur-sm sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-none text-white">LEO</p>
            <p className="mt-1 text-xs font-medium text-white/80 sm:text-sm">
              {t('Your WAHO top-up contact', 'جهة التواصل لشحن WAHO', '您的 WAHO 充值联系人')}
            </p>
          </div>
          <span className="flex-shrink-0 rounded-full bg-[#ffd33d] px-3 py-1 text-xs font-semibold text-[#071b46]">
            {t('Trusted', 'موثوق', '可信赖')}
          </span>
        </div>
      </div>
    </section>
  );
}
