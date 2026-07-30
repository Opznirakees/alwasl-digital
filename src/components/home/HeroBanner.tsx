'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  Headphones,
  ReceiptText,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import type { Banner } from '@/types';
import { useApp } from '@/contexts/AppContext';

interface HeroBannerProps {
  banner?: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const { t, dir } = useApp();
  const metrics = [
    {
      icon: UserRoundCheck,
      title: t('Account checked', 'فحص الحساب', '检查账号'),
      body: t('Before payment', 'قبل الدفع', '付款前完成'),
    },
    {
      icon: ShieldCheck,
      title: t('Clear total', 'إجمالي واضح', '总价清晰'),
      body: t('Before confirmation', 'قبل التأكيد', '确认前可见'),
    },
    {
      icon: ReceiptText,
      title: t('Order tracking', 'تتبع الطلب', '订单跟踪'),
      body: t('With your order ID', 'باستخدام رقم الطلب', '使用订单号'),
    },
    {
      icon: Headphones,
      title: t('WhatsApp help', 'مساعدة واتساب', 'WhatsApp 帮助'),
      body: t('Ask LEO directly', 'اسأل LEO مباشرة', '直接联系 LEO'),
    },
  ];

  return (
    <section
      data-v2-hero
      aria-label={banner ? t(banner.title, banner.titleAr, banner.title) : t('WAHO top-up', 'شحن WAHO', 'WAHO 充值')}
      className="relative min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[#020817] text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:min-h-[560px] lg:min-h-[500px]"
    >
      <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-full sm:w-[72%] lg:w-[60%]`}>
        <Image
          src="/brand/leo-waho-agent.jpeg"
          alt={t('LEO, your WAHO top-up contact', 'LEO، جهة التواصل لشحن WAHO', 'LEO，您的 WAHO 充值联系人')}
          fill
          priority
          className={`object-cover ${dir === 'rtl' ? 'object-[44%_32%]' : 'object-[56%_32%]'} sm:object-center`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 72vw, 760px"
        />
      </div>

      <div
        className={`absolute inset-0 ${
          dir === 'rtl'
            ? 'bg-[linear-gradient(90deg,rgba(2,8,23,0.08)_0%,rgba(2,8,23,0.72)_50%,#020817_88%)]'
            : 'bg-[linear-gradient(90deg,#020817_12%,rgba(2,8,23,0.88)_48%,rgba(2,8,23,0.12)_100%)]'
        }`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.04)_20%,rgba(2,8,23,0.28)_64%,#020817_100%)] sm:bg-[linear-gradient(180deg,rgba(2,8,23,0.02)_28%,rgba(2,8,23,0.18)_62%,#020817_100%)]" />

      <div className="v2-hero-brandmark absolute right-5 top-0 z-20 hidden h-32 w-32 overflow-hidden rounded-b-lg border-x border-b border-white/15 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] md:block lg:right-10 lg:h-44 lg:w-44">
        <div className="absolute inset-3 overflow-hidden rounded-lg">
          <Image src="/brand/alwasl-logo.jpg" alt="" fill className="object-cover" sizes="152px" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-[560px] items-center px-5 pb-36 pt-7 sm:min-h-[560px] sm:px-10 sm:pb-32 lg:min-h-[500px] lg:px-12 lg:pb-28">
        <div className={`max-w-[610px] ${dir === 'rtl' ? 'text-right lg:ms-48' : 'text-left'}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f7b928]/35 bg-[#071b46]/72 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-[#f7b928]" />
            {t('Simple WAHO balance top-up', 'شحن رصيد WAHO بسهولة', '轻松充值 WAHO 余额')}
          </div>

          <h1 className="mt-4 max-w-2xl text-[2rem] font-bold leading-[1.08] text-white sm:mt-5 sm:text-5xl lg:text-5xl xl:text-6xl">
            {t('Top up your', 'اشحن رصيد', '为您的')}{' '}
            <span className="text-[#f7b928]">WAHO</span>{' '}
            {dir !== 'rtl' && t('balance', 'الرصيد', '余额充值')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/76 sm:mt-5 sm:text-lg sm:leading-7">
            {t(
              'Choose the balance, check the WAHO account, and confirm. You always see what comes next.',
              'اختر الرصيد وتحقق من حساب WAHO ثم أكد الطلب. تعرف دائماً ما هي الخطوة التالية.',
              '选择余额，检查 WAHO 账号，然后确认。每一步都清楚可见。'
            )}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link data-testid="home-primary-topup" href="/top-up/waho-top-up" className="v2-primary-button sm:min-w-44">
              {t('Choose amount', 'اختر المبلغ', '选择金额')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/help" className="v2-secondary-button border-white/22 bg-white/5 text-white hover:bg-white/10 sm:min-w-40">
              <CircleHelp className="h-4 w-4 text-[#f7b928]" />
              {t('How it works', 'كيف يعمل', '如何操作')}
            </Link>
          </div>

          <div className="mt-5 hidden max-w-full items-center gap-3 rounded-lg border border-white/12 bg-[#020817]/62 px-3 py-2.5 backdrop-blur-md sm:inline-flex">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#f7b928]">
              <Image src="/brand/leo-waho-agent.jpeg" alt="" fill className="object-cover object-[52%_28%]" sizes="40px" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                LEO <BadgeCheck className="h-4 w-4 flex-shrink-0 text-[#f7b928]" />
              </p>
              <p className="truncate text-xs text-white/68">
                {t('Your WAHO top-up contact', 'جهة التواصل لشحن WAHO', '您的 WAHO 充值联系人')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="v2-hero-metrics absolute inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-white/12 bg-[#020817]/90 px-3 py-3 backdrop-blur-xl sm:grid-cols-4 sm:px-7 sm:py-3 lg:px-10">
        {metrics.map((item) => (
          <div key={item.title} className="flex min-h-[62px] items-center gap-2.5 border-white/10 px-2 py-2 sm:min-h-[58px] sm:border-e sm:px-4 last:sm:border-e-0">
            <item.icon className="h-5 w-5 flex-shrink-0 text-[#f7b928]" />
            <div className="min-w-0">
              <p className="text-xs font-bold leading-5 text-white sm:text-sm">{item.title}</p>
              <p className="text-[11px] leading-4 text-white/58 sm:text-xs">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
